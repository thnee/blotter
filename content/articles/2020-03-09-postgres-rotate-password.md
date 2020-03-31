---
title: "PostgreSQL rotate password"
slug: "postgresql-rotate-password"
date: 2020-03-09 23:16:12 +0100
tags:
  - "Software Engineering"
  - "PostgreSQL"
  - "Security"
---

Quick recipe for how to rotate password in PostgreSQL without downtime.

PostgreSQL roles can be created as members of another role,
giving them the potential to inherit their privileges,
assuming the INHERIT attribute is set (the default).

<!--more-->

This is what the documentation has to say about it.

> The INHERIT attribute governs inheritance of grantable privileges (that is, access privileges for database objects and role memberships). It does not apply to the special role attributes set by CREATE ROLE and ALTER ROLE. For example, being a member of a role with CREATEDB privilege does not immediately grant the ability to create databases, even if INHERIT is set; it would be necessary to become that role via SET ROLE before creating a database.

Furthermore, INHERIT is enabled by default.

> The INHERIT attribute is the default for reasons of backwards compatibility: in prior releases of PostgreSQL, users always had access to all privileges of groups they were members of. However, NOINHERIT provides a closer match to the semantics specified in the SQL standard.



## Preparation

Assuming that the regular role used by the app is called `platinum`.

Let's create a temporary role that is a member of the original role.

```sql
create role platinum_temp with login password 'temp_password' in role platinum;
```

Alternatively, existing roles can be added and removed to and from roles
using GRANT and REVOKE.

```sql
grant platinum to platinum_temp;
revoke platinum from platinum_temp;
```

Listing existing roles will show the new role.
Note that `platinum_temp` is a "Member of" `platinum`.

```plain
my_db=# \du
              List of roles              
   Role name   | Attributes | Member of  
---------------+------------+------------
 platinum      | Superuser  | {}
 platinum_temp |            | {platinum}
```

Let's also define SET ROLE on the role,

```sql
alter role platinum_temp set role platinum;
```

This makes it so that every new session created as `platinum_temp` will automatically
become the `platinum` role,

Logging in as `platinum_temp` and checking the current user
will show that the session is actually using `platinum`.

```plain
$ psql -U platinum_temp
my_db=# select current_user;
 current_user 
--------------
 platinum
(1 row)
```

## Making the switch

Change the client program to use the temporary role `platinum_temp` and its password.

Change the password for the `platinum` user.

```sql
alter role platinum with password 'new_password';
```

Change the client program back to using the regular role `platinum` and its password.

Remove the temporary role.

```sql
drop role platium_temp;
```



## References

- https://www.postgresql.org/docs/12/sql-createrole.html
- https://www.postgresql.org/docs/12/sql-alterrole.html
- https://www.postgresql.org/docs/12/sql-set-role.html
- https://www.postgresql.org/docs/12/sql-grant.html
- https://www.postgresql.org/docs/12/sql-revoke.html
