import pytest
import pytest_asyncio
from botocore.exceptions import ClientError
from httpx import ASGITransport, AsyncClient

from src.main import app, s3, settings


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture(scope="session", autouse=True)
def ensure_bucket():
    """Create the uploads bucket if it doesn't exist."""
    try:
        s3.head_bucket(Bucket=settings.s3_bucket)
    except ClientError:
        s3.create_bucket(Bucket=settings.s3_bucket)


@pytest.fixture
def s3_client():
    return s3


@pytest.fixture
def bucket():
    return settings.s3_bucket
