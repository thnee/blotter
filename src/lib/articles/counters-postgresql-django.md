---
slug: "counters-postgresql-django"
title: "Counters with PostgreSQL and Django"
date: "2019-12-27"
description: >
  Guide to implementing counters in PostgreSQL,
  especially paying attention to common pitfalls,
  with pratical code examples in SQL and Django ORM.
tags:
  - "Software Engineering"
  - "PostgreSQL"
  - "Python"
  - "Django"
---

Almost all web apps will need counters.
Let's take a look at how to create counters that are accurate and have good performance.

Perhaps you want to count the number of related objects per object,
such as total number of comments per article.
Or perhaps you want to count the total number of things in a system,
such as total number of users.
In either case, there are certain things that must be taken into consideration,
to avoid slowing down performance, and to ensure correctness.



## Foreword: Transaction isolation

In order to understand how to make atomic operations in SQL,
it is necessary to first understand isolation levels.
The isolation level affects how the database will create and keep locks on the data,
which are used to handle conflict scenarios.

Try to at least read the [Wikipedia page on Isolation][wikipedia-iso],
and the [Postgres Transaction Isolation docs][postgres-iso] are also really good.

This article is written for PostgreSQL
using the default isolation level Read Committed.

<div class="note note-info">
In PostgreSQL, MS SQL Server, and Oracle the default isolation level is Read Commited.<br>
In MySQL/MariaDB the default isolation level is Repeatable Read.
</div>

<div class="note note-warning">
It's not hard to change the isolation level itself,
but keep in mind that changing the isolation level for an existing application
can change how it functions, and application code may need to be refactored.
So this is something you need to be aware of and choose correctly from the start.
</div>



## Example models

As an example, let's say that there is an app called `blog` with these models.

```python
class User(models.Model):
    username = models.CharField()


class Article(models.Model):
    content = models.CharField()


class Comment(models.Model):
    creator = models.ForeignKey("blog.User", related_name="comments")
    article = models.ForeignKey("blog.Article", related_name="comments")

    message = models.CharField()
    publish_status = models.CharField(
        max_length=100,
        choices=["public", "Public", "private", "Private"],
    )
```



## Stage 1: Subqueries

Let's say that there is a requirement to
show the number of public comments for each article in a list of articles.

#### A common mistake

You might start out by doing something like this.

```python
articles = Article.objects.all()
for article in articles:
    print(article.comments.filter(publish_status="public").count())
```

This is going to produce [a lot of queries][orm-nplus1].
If you are still writing queries like this,
you absolutely have to learn how to use subqeries.

#### A bit better

Let's use `annotate` and a subquery instead, this will
[dramatically improve performance][benefits-subqueries].

```python
Article.objects.annotate(
    total_public_comments=models.Count(
        "comments", filter=models.Q(publish_status="public")
    )
)
```

This is probably the easiest way to start, and it is fine, up to a point.
But it may not scale far enough — the count will be executed every single time,
even if the value has not changed,
and as the number of comments grows the count will take longer.

What if you have a lot of articles and comments,
and there is a requirement to find the top ten articles with the most comments?



## Stage 2: Dedicated counters

Let's use dedicated counters to keep track of the values. This has several benefits.

- Avoid counting all the objects repeatedly, only increment / decrement existing value.
- Counters are immediately available everywhere for displaying, ordering, filtering.

Let's add the following fields to the models.

```python
class User(models.Model):
    ...
    total_public_comments = models.BigIntegerField(default=0)


class Article(models.Model):
    ...
    total_public_comments = models.BigIntegerField(default=0)
```

But now it is important to really think about how to keep this counter up to date.

#### A common mistake

I have seen code like this on several occasions, which is a mistake.

```python
article = Article.objects.get(...)
article.total_public_comments += 1
article.save()
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
article = Article.objects.get(...)
article.total_public_comments = models.F("total_public_comments") + 1
article.save(update_fields=["total_public_comments"])
```

Which will perform SQL like this.

```sql
UPDATE "blog_article"
   SET "total_public_comments" = "blog_article"."total_public_comments" + 1
 WHERE "blog_article"."id" = ...
```

This is definitely better, as it does an atomic update at the database level,
which ensures the value is actually correct.

But it is brittle, because you have to remember to add it everywhere.
For example, it would be very nice to not have to modify the Django admin
just to keep the counters up to date.

And it has the potential to deadlock
if multiple processes are trying to update the same counter.
It is always possible to avoid deadlocks
by carefully crafting the code in a certain way.
But it would be nice to have a solution that
does not even have the potential for deadlocks.
(Or *dreadlocks* as I like to say, jokingly).

<div class="note note-danger">
If some code has the potential to deadlock,
it can go unnoticed for a long time,
because it is unlikely to happen when you have low amounts of traffic.
But as traffic increases,
so does the likelihood that the deadlock starts happening,
and it can blow up in your face.
So let's build a solution
that does not even have the potential to deadlock in the first place.
</div>


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

Let's create a new app called `counting`, and add this model.

```python
class Task(models.Model):
    id = models.AutoField(primary_key=True, editable=False, verbose_name="ID")

    table_name = models.CharField(max_length=200, null=True, blank=True)
    row_id = models.IntegerField(null=True, blank=True)
    name = models.CharField(max_length=200)
    value = models.IntegerField()
```

Since `row_id` is an `IntegerField`, this assumes that all models are standardized
to use integers for their `id` field.

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

```sql
CREATE OR REPLACE FUNCTION counting_process_tasks(task_limit INT DEFAULT 1000)
RETURNS void
AS $$
DECLARE
  counter_sum RECORD;
BEGIN
  FOR counter_sum IN
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
    SELECT
      table_name,
      row_id,
      name,
      sum
    FROM counter_sums
  LOOP
    EXECUTE format(
      'UPDATE %I SET %I = %I + %s WHERE id = %L',
      counter_sum.table_name,
      counter_sum.name,
      counter_sum.name,
      counter_sum.sum,
      counter_sum.row_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

This function will delete a number of tasks from the queue,
calculate the sum for every unique counter name,
and execute a dynamic SQL statement to update the row in the target table for each sum.



## Stage 4: Update via trigger

Instead of relying on Python/Django to update counters every time,
let's use a database trigger.
This has several benefits.

- Less code and less mistakes.  
  Triggers are executed automatically by the database
  regardless of what part of the app is performing an operation.
- Better reliability and correctness in case of failures.  
  It is guaranteed to execute in the same transaction
  as the operation that triggered it.
- Better performance.  
  There are fewer roundtrips to the database.

Let's add the following SQL in the `blog` app.

```sql
CREATE OR REPLACE FUNCTION blog_comment_update_counters()
RETURNS trigger
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.publish_status = 'public' THEN
            INSERT INTO counting_task VALUES ('blog_article', NEW.article_id, 'total_public_comments', +1);
            INSERT INTO counting_task VALUES ('blog_user', NEW.creator_id, 'total_public_comments', +1);
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.publish_status = 'private' AND NEW.publish_status = 'public' THEN
            INSERT INTO counting_task VALUES ('blog_article', NEW.article_id, 'total_public_comments', +1);
            INSERT INTO counting_task VALUES ('blog_user', NEW.creator_id, 'total_public_comments', +1);

        ELSIF OLD.publish_status = 'public' AND NEW.publish_status = 'private' THEN
            INSERT INTO counting_task VALUES ('blog_article', NEW.article_id, 'total_public_comments', -1);
            INSERT INTO counting_task VALUES ('blog_user', NEW.creator_id, 'total_public_comments', -1);
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.publish_status = 'public' THEN
            INSERT INTO counting_task VALUES ('blog_article', OLD.article_id, 'total_public_comments', -1);
            INSERT INTO counting_task VALUES ('blog_user', OLD.creator_id, 'total_public_comments', -1);
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

- Total number of public comments published on every article.
- Total number of public comments created by every user.

<div class="note note-info">
This function is just an example, it does not handle every possible case.
For example, it does not handle the case of
changing the user or article on an existing comment.
And it only counts public comments, not private comments.
You will need to define what operations are supported and what counters are needed
in your application, and handle those appropriately.
</div>


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
[orm-nplus1]: https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem-in-orm-object-relational-mapping
[benefits-subqueries]: https://medium.com/@hansonkd/the-dramatic-benefits-of-django-subqueries-and-annotations-4195e0dafb16
[wikipedia-atomic-adder]: https://en.wikipedia.org/wiki/Compare-and-swap#Example_application:_atomic_adder
[depesz-counters]: https://www.depesz.com/2016/06/14/incrementing-counters-in-database/
[cybertec-counters]: https://www.cybertec-postgresql.com/en/postgresql-count-made-fast/
[harrys-counters]: https://medium.com/harrys-engineering/atomic-increment-decrement-operations-in-sql-and-fun-with-locks-f7b124d37873
[entirely-possible]: https://www.youtube.com/watch?v=MPJ0AB12h1I
