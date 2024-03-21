---
url: "authentication-http-modern-frontend"
title: "Authentication over HTTP in modern frontend apps"
date: "2022-10-17"
description: >
  Guide to doing authentication over HTTP correctly in modern frontend apps.
tags:
  - "Software Engineering"
  - "Security"
---

## What not to do

Let's start with the don'ts. There are several common mistakes to consider.

### Don't use OAuth

It's a common mistake to use OAuth for authentication.

The use case for OAuth is to enable a login flow
where the user authenticates via a third party.
It is not intended for a typical login flow in a regular app.

The [OAuth 2.0 RFC 6749][rfc6749] states:

> The OAuth 2.0 authorization framework enables a third-party
application to obtain limited access to an HTTP service

This means having a flow like "Login with Google",
where the user can authenticate with Google,
and then be returned to your application.  
In this case, Google is the provider service, and you are the client service in OAuth.

Unless you are an authentication service provider like Google,
you should not be implementing OAuth.

### Don't use JWT

It's a common mistake to use JWT for authentication tokens.

JWT is intended for delegation of permissions when authenticating via a third party.
It is not intended for a typical login flow in a regular app.

The [JWT RFC 7519][rfc7519] states:

> JSON Web Token (JWT) is a compact,
URL-safe means of representing claims to be transferred between two parties.

This means having a flow like "Login with Google",
where the user can authenticate with Google using OAuth,
and the user can select which which type of data they want to share with your app.  
In this case, Google could create a JWT that contains that information,
and return it to your app.
And your app could use that token
to fetch only the types of data that the user selected.

Unless you are an authentication service provider like Google,
you should not be creating JWT tokens.

### Don't store authentication tokens in Web Storage (localStorage)

It's a common mistake
to store authentication tokens in Web Storage (which localStorage is part of).

Web Storage is not a secure place to store authentication tokens.
Any JavaScript code that runs in your app can access Web Storage.

Modern JavaScript apps have a lot of external code from thousands of libraries.  
Open source libraries have been a popular target
for attackers to inject malicious code into.  
And it's very common that apps have some Cross Site Scripting vulnerability
that allows injecting malicious code.

Any malicious JavaScript code that makes it into an app can read the data stored
in Web Storage and send it to an external server.

Don't be that developer who thinks "it won't happen to me".



## What to do

Let's look at two types of applications, Web apps and Mobile apps,
and two types of authentication, Session authentication and Token authentication.  
Each type of app requires using a specific type of authentication.

### Web apps

Web apps running in a web browser must use Session authentication only.  
Because web browsers — unlike mobile apps —
do not have any secure place to manually store authentication tokens.

It does not matter if the app is hosted on the same origin as the backend or not,
and it does not matter if the app is server side rendered or a single page app,
the solution is still the same: Session authentication must be used.

### Mobile apps

Mobile apps must use Token authentication only.  
Because in a mobile app, Sessions don't work,
since requests are made with a request library and not a web browser.  
And mobile apps — unlike web browsers —
do have a secure place to manually store authentication tokens, the Keychain.

It does not matter what technology is used
to develop the mobile app (JavaScript or native code),
the solution is still the same: Token authentiction must be used.

### Session authentication

Session authentication is based on cookies,
and is usually supported out of the box in most backend frameworks.  
But in order for it to be secure, certain settings must be enabled.

It's important that the `Secure` and `HttpOnly` attributes are enabled
on the session cookie.  
Read more about how to
[restrict access to cookies on MDN][mdn-restrict-access-to-cookies].

If the frontend app is running on a different origin (domain) than the backend service,
then CORS is going to come into play.

First, the backend must be configured
to set the CORS header `Access-Control-Allow-Credentials: true`.

Then, the frontend can make a request to a login API endpoint,
and the backend can return a response that sets the session cookie.

Then, when the frontend makes subsequent requests
to an API endpoint that requires authentication,
it must include the credentials.

- If XHR is used,
the [`withCredentials` attribute][mdn-xhr-withcredentials] needs to be enabled.
- If the `fetch()` method is used,
then the [`credentials` attribute][mdn-fetch-credentials] must be set to `include`.

Note that there is no need to pass any credentials manually
on the subsequent requests.  
The browser will include the session cookie automatically behind the scenes
on all subsequent requests.  
In fact, the JavaScript code in the frontend
does not even have access to read the content of the cookie,
since the `HttpOnly` attribute is enabled on the session cookie.  

### Token authentication

Token authentication is based on generating tokens and passing them via an HTTP header.

A token can be any securely generated sequence of random bytes.  
In most languages, there is built in support for this,
and there is usually no need to use any third party library to generate tokens.  
For example, in Python we can use `secrets.token_urlsafe(50)` to generate a token.

It is necessary to store the token in a database on the backend.  
It may be tempting to not store the token in a database,
and instead include some expiration timestamp inside the token data.  
But this is not sufficient, because it does not allow for blocking tokens on demand.  
For example, it may be necessary to block a token if it's being used to spam the API,
or it may be necessary to block all tokens for a certain user if that user is banned.  
Blocking a token can be done by either deleting the record from the database table,
or by setting a flag on the record to indicate that it has been blocked.

Using token authentication on the client side is very straight forward.  
The client just retrieves the token from the Keychain,
and sets it in the `Authorization` header on outgoing requests.



## Design notes

If a product has both web app clients and mobile app clients,
it is necessary to use both Session authentication and Token authentication.  
This can easily be supported within the same backend service.  

For example, an HTTP API can have two login API endpoints,
called `/login/session` and `/login/token`.  
The first one would set a Session cookie, and not return anything in the body.  
The second one would create a token in the database, and return it in the body.

And any endpoints that require authentication
can implement a handler that checks for the presence of either
a Session cookie or the `Authorization` header,
and authenticates the user based on either one.



## Conclusion

It is very easy to do the right thing here.  
If you are using a modern language and a standard framework,
you already have everything you need.  
There is no need to add any additional libraries or implement complex protocols
to achieve correct and secure authentication.

There are a lot of common anti-patterns being used today,
mainly OAuth and JWT.  
They are definitely secure, but also overly complicated and totally unnecessary,
if the use case is regular authentication in a regular application.



[rfc6749]: https://www.rfc-editor.org/rfc/rfc6749
[rfc7519]: https://www.rfc-editor.org/rfc/rfc7519
[mdn-restrict-access-to-cookies]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies
[mdn-xhr-withcredentials]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
[mdn-fetch-credentials]: https://developer.mozilla.org/en-US/docs/Web/API/fetch#credentials
