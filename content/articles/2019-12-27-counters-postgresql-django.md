---
title: "Counters with PostgreSQL and Django"
slug: "counters-postgresql-django"
date: 2019-12-27 15:28:42 +0100
tags:
  - "Software Engineering"
  - "PostgreSQL"
  - "Python"
  - "Django"
---

Almost all web apps will need counters.
Let's take a look at how to create counters that are accurate and have good performance.

Perhaps you want to count the number of related objects per object,
such as comments per article.
Or perhaps you want to count the total number of things in a system,
such as number of users.
In either case, there are certain things that must be taken into consideration,
to avoid slowing down performance, and to ensure correctness.

As an example, let's say that there is an app called `blog` with this model.

```python
class Comment(models.Model):
    creator = models.ForeignKey("core.User", related_name="comments")
    article = models.ForeignKey("blog.Article", related_name="comments")
    publish_status = models.CharField(
        max_length=100,
        choices=["public", "Public", "private", "Private"],
    )
    ...
```



## Foreword: Transaction isolation

In order to understand how to make atomic operations in SQL,
it is necessary to first understand isolation levels.
The isolation level affects how the database will create and keep locks on your data,
which are used to handle conflict scenarios.

Try to at least read the [Wikipedia page on Isolation][wikipedia-iso],
and the [Postgres Transaction Isolation docs][postgres-iso] are also really good.

This article is written for PostgreSQL
using the default isolation level Read Committed.

{{% toast status="info" %}}
In MySQL/MariaDB the default isolation level is Repeatable Read not Read Committed.
It's not hard to change the isolation level itself,
but keep in mind that changing the isolation level for an existing application
can change how it functions, and application code may need to be refactored.
Be careful!
{{% / %}}


## Stage 1: Subqueries

Let's say that there is a requirement to
show the number of comments for each article in a list of articles.
You might start by doing a count in a subquery for every article when selecting them.

```python
Article.objects.annotate(num_comments=models.Count("comments"))
```

This is probably the easiest way to start, and it is fine, up to a point.
But it may not scale far enough — the count will be executed every single time,
even if the value has not changed,
and as the number of comments grows the count will take longer.

What if you have a lot of articles and comments,
and there is a requirement to find the ten articles with the most comments?



## Stage 2: Dedicated counters

Let's use a dedicated counter to keep track of the value. This has several benefits.

- Counter value is only updated when it actually changes.
- Avoids counting all the objects, only increment/decrement existing value.

Let's add an app called `counting` with this model.

```python
class Counter(models.Model):
    table_name = models.CharField(max_length=200, null=True, blank=True)
    row_id = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=200)
    value = models.BigIntegerField()
```

The `table_name` and `row_id` fields allow `null` just to make it possible to have
some counters that are global, i.e. not specific to any particular model or row.

But now it is important to really think about how to keep this counter up to date.

#### A common mistake

I have seen code like this on several occasions, which is a mistake.

```python
counter = Counter.objects.get(...)
counter.value += 1
counter.save()
```

This is unfortunately **not good** at all.
The incrementation happens in Python, not in the database,
which means that it is not an atomic operation.
There is a time between
reading the old value from the database and writing the new value to the database,
where other processes may also be running the same function.
Which leads to one process overwriting the value of the other,
resulting in an inconsistent value.

#### A bit better

To ensure the counter value is correct,
it is necessary to do an atomic operation known as
[Compare-and-swap or Fetch-and-add][wikipedia-atomic-adder].

One might sprinkle statements like this all over the place.

```python
counter = Counter.objects.get(...)
counter.value = models.F("value") + 1
counter.save(update_fields=["value"])
```

Which will perform SQL like this.

```sql
UPDATE "counting_counter"
   SET "value" = "counting_counter"."value" + 1
 WHERE "counting_counter"."id" = ...
```

This is definitely better, as it does an atomic update at the database level,
which ensures the value is actually correct.

But it is brittle, because you have to remember to add it everywhere.
For example, it would be very nice to not have to modify the Django admin
just to keep the counters up to date.

And it has the potential to deadlock
if multiple processes are trying to update the same counter.
It is always possible to avoid deadlocks
by carefully crafting your code in a certain way.
But it would be nice to have a solution that
does not even have the potential for deadlocks.
(Or *dreadlocks* as I like to say, jokingly).

{{% toast status="danger" %}}
If some code has the potential to deadlock,
it can go unnoticed for a long time,
because it is unlikely to happen when you have low amounts of traffic.
But as traffic increases,
so does the likelihood that the deadlock starts happening,
and it can blow up in your face.
So let's build a solution
that does not even have the potential to deadlock in the first place.
{{% / %}}



## Stage 3: Queue updates

As long as multiple processes are trying to update the same counter value,
there is a potential for deadlocks.
The solution to this problem is to have a queue of updates,
which is applied periodically.
This has several benefits.

- Eliminates deadlocks.  
  To update a counter, an `INSERT` operation is used instead of an `UPDATE`.
- Better performance.  
  An `INSERT` is faster than an `UPDATE`
  or an `INSERT ... ON CONFLICT ... DO UPDATE` (aka. upsert).
- Simpler logic.  
  There is no need to check if the counter exists yet when doing the original operation.

Let's add this model in the `counting` app.

```python
class Task(models.Model):
    table_name = models.CharField(max_length=200, null=True, blank=True)
    row_id = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=200)
    value = models.SmallIntegerField()
```

#### Process counter tasks

Let's add a management command in the `counting` app
that processes queue tasks and updates counters.
This management command will need to be scheduled to run repeatedly,
for example via a cronjob.

```python
from django.core.management.base import BaseCommand
from django import db


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        with db.connection.cursor() as cursor:
            cursor.callproc("counting_process_tasks")
```

It would be [entirely possible][entirely-possible] to implement this function in Python,
safely and correctly.
But if it is implemented as a database function, performance will be much better.


Django does not have built in support for creating functions.
Custom SQL can be added by manually adding a `RunSQL` operation to a migration.

Let's add the following SQL in the `counting` app.

```plpgsql
CREATE OR REPLACE FUNCTION counting_process_tasks(task_limit INT DEFAULT 1000)
RETURNS void
AS $$
WITH
task_ids AS (
    SELECT
        MIN(id) as min_id,
        MIN(id) + task_limit as max_id
    FROM counting_task
),
deleted_task AS (
    DELETE FROM counting_task
    WHERE id BETWEEN
        (SELECT min_id from task_ids) AND
        (SELECT max_id FROM task_ids)
    returning *
),
counter_sums AS (
    SELECT
        table_name,
        row_id,
        name,
        SUM(value) as sum
    FROM deleted_task
    GROUP BY table_name, row_id, name
    HAVING SUM(value) <> 0
)
INSERT INTO counting_counter AS cc
    (table_name, row_id, name, value)
    SELECT table_name, row_id, name, sum
    FROM counter_sums
ON CONFLICT (table_name, row_id, name)
DO UPDATE SET
    value = cc.value + EXCLUDED.value;
$$ LANGUAGE sql;
```

This function will delete a number of tasks from the queue,
calculate the sum for every unique counter name,
and either insert into or update the counter table.
Which means that if the counter does not exist yet, it will be created.



## Stage 4: Update via trigger

Instead of relying on Python/Django to update counters every time,
let's use a database trigger.
This has several benefits.

- Less code and less mistakes.  
  Triggers are executed automatically by the database
  regardless of what part of the app is performing an operation.
- Better reliability/correctness in case of failures.  
  It is guaranteed to execute in the same transaction
  as the operation that triggered it.
- Better performance.  
  There are fewer roundtrips to the database.

Let's add the following SQL in the `blog` app.

```plpgsql
CREATE OR REPLACE FUNCTION blog_comment_update_counters()
RETURNS trigger
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.publish_status = 'public' THEN
            INSERT INTO counting_task VALUES ('blog_article', NEW.article_id, 'public_comments', +1);
            INSERT INTO counting_task VALUES ('core_user', NEW.creator_id, 'public_comments', +1);
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.publish_status = 'private' AND NEW.publish_status = 'public' THEN
            INSERT INTO counting_task VALUES ('blog_article', NEW.article_id, 'public_comments', +1);
            INSERT INTO counting_task VALUES ('core_user', NEW.creator_id, 'public_comments', +1);

        ELSIF OLD.publish_status = 'public' AND NEW.publish_status = 'private' THEN
            INSERT INTO counting_task VALUES ('blog_article', NEW.article_id, 'public_comments', -1);
            INSERT INTO counting_task VALUES ('core_user', NEW.creator_id, 'public_comments', -1);
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.publish_status = 'public' THEN
            INSERT INTO counting_task VALUES ('blog_article', OLD.article_id, 'public_comments', -1);
            INSERT INTO counting_task VALUES ('core_user', OLD.creator_id, 'public_comments', -1);
        END IF;

        RETURN OLD;
    END IF;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_comment_update_counters_t ON blog_comment;

CREATE TRIGGER blog_comment_update_counters_t
AFTER INSERT OR UPDATE OR DELETE ON blog_comment
FOR EACH ROW EXECUTE PROCEDURE blog_comment_update_counters();
```

This function will update two counters for every article and every user.

- Number of public comments published on every article.
- Number of public comments created by every user.

{{% toast status="info" %}}
This function is just an example, it does not handle every possible case.
For example, it does not handle the case of
changing the user or article on an existing comment.
And it only counts public comments, not private comments.
You will most definitely want to change this function to suit your project.
{{% / %}}



## References

This article is heavily based on an [article by depesz][depesz-counters],
and adapted for Django.
It has an interesting additional point about performance:
the counter queue table could be unlogged for a substantial speed up,
but this would also decrease reliability during failures.

Also check out this interesting [article by Laurenz Albe][cybertec-counters].
It discusses why `count(*)` is slow,
and suggests a method for getting *estimated* counts for tables.

Yet another [article by Pierre Jambet][harrys-counters] discusses the
possible deadlock situations that can happen.



[postgres-iso]: https://www.postgresql.org/docs/9.6/transaction-iso.html
[wikipedia-iso]: https://en.wikipedia.org/wiki/Isolation_(database_systems)
[wikipedia-atomic-adder]: https://en.wikipedia.org/wiki/Compare-and-swap#Example_application:_atomic_adder
[depesz-counters]: https://www.depesz.com/2016/06/14/incrementing-counters-in-database/
[cybertec-counters]: https://www.cybertec-postgresql.com/en/postgresql-count-made-fast/
[harrys-counters]: https://medium.com/harrys-engineering/atomic-increment-decrement-operations-in-sql-and-fun-with-locks-f7b124d37873
[entirely-possible]: https://www.youtube.com/watch?v=MPJ0AB12h1I
