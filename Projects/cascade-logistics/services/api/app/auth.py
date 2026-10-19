"""Auth helpers shared by all HTTP handlers."""
import functools


class AuthError(Exception):
    pass


def require_auth(fn):
    """Decorator that enforces a caller identity is present on the request context."""

    @functools.wraps(fn)
    def wrapper(request, *args, **kwargs):
        if not request.get("user"):
            raise AuthError(f"{fn.__name__} requires an authenticated user")
        return fn(request, *args, **kwargs)

    return wrapper
