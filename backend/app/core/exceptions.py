from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception."""
    pass


class NotFoundException(AppException):
    def __init__(self, resource: str, identifier: str | int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with identifier '{identifier}' was not found.",
        )


class ConflictException(AppException):
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=message,
        )


class BadRequestException(AppException):
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )


class InsufficientStockException(BadRequestException):
    def __init__(self, available: int, requested: int):
        super().__init__(
            message=(
                f"Insufficient stock. Requested: {requested}, "
                f"Available: {available}."
            )
        )
