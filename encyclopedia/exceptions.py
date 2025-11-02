class WikiError(Exception):
    """Base exception for Wiki-fetching errors."""
    status_code = 500
    default_message = "An error occurred while fetching data."

    def __init__(self, message=None, *, status_code=None, title=None):
        self.message = message or self.default_message
        self.status_code = status_code or self.status_code
        self.title = title or "Unknown Article"
        super().__init__(self.message)


class WikiTimeoutError(WikiError):
    status_code = 504
    default_message = "The request to Wiki timed out."

class WikiConnectionError(WikiError):
    status_code = 503
    default_message = "Unable to connect to Wiki."

class WikiHTTPError(WikiError):
    status_code = 502
    default_message = "Wiki returned an HTTP error."

    def __init__(self, message=None, status_code=None, http_status=None):
        super().__init__(message or self.default_message, status_code=status_code)
        self.http_status = http_status

class WikiNotFoundError(WikiError):
    status_code = 404
    default_message = "The requested article could not be found."

