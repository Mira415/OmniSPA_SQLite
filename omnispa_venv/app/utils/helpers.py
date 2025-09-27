from datetime import datetime

def datetimeformat(value, format='%B %d, %Y'):
    """Custom Jinja2 filter for formatting dates."""
    if value is None:
        return ''
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return value
    return value.strftime(format)