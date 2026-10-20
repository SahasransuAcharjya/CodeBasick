"""Application logging configuration."""

import logging
import sys
from typing import Optional
from app.core.config import Settings


def setup_logging(settings: Optional[Settings] = None) -> logging.Logger:
    """Configure structured, clean application logging.

    Args:
        settings: Application settings containing LOG_LEVEL and ENVIRONMENT.

    Returns:
        Configured root logger instance.
    """
    log_level = settings.LOG_LEVEL if settings else "INFO"
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    log_format = (
        "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    )
    date_format = "%Y-%m-%d %H:%M:%S"

    # Configure root logger
    logging.basicConfig(
        level=numeric_level,
        format=log_format,
        datefmt=date_format,
        stream=sys.stdout,
        force=True,
    )

    # Set third-party logger levels to avoid excessive verbosity
    logging.getLogger("uvicorn").setLevel(numeric_level)
    logging.getLogger("uvicorn.access").setLevel(numeric_level)
    logging.getLogger("uvicorn.error").setLevel(numeric_level)

    logger = logging.getLogger("codebasick")
    logger.setLevel(numeric_level)
    return logger


logger = logging.getLogger("codebasick")
