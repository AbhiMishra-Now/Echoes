"""Create the Echoes DynamoDB single-table if it does not already exist."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
TABLE_NAME = os.getenv("DYNAMODB_TABLE", "echoes_biographies")
REGION = os.getenv("AWS_REGION", "us-east-1")


def main() -> None:
    """Create PK/SK table with On-Demand billing, avoiding idle database cost."""
    client = boto3.client("dynamodb", region_name=REGION)
    try:
        client.describe_table(TableName=TABLE_NAME)
        print(f"Table '{TABLE_NAME}' already exists.")
        return
    except ClientError as exc:
        if exc.response["Error"]["Code"] != "ResourceNotFoundException":
            raise
    client.create_table(TableName=TABLE_NAME, AttributeDefinitions=[{"AttributeName": "PK", "AttributeType": "S"}, {"AttributeName": "SK", "AttributeType": "S"}], KeySchema=[{"AttributeName": "PK", "KeyType": "HASH"}, {"AttributeName": "SK", "KeyType": "RANGE"}], BillingMode="PAY_PER_REQUEST", Tags=[{"Key": "Project", "Value": "Echoes"}, {"Key": "Environment", "Value": "Development"}])
    client.get_waiter("table_exists").wait(TableName=TABLE_NAME)
    print(f"Created On-Demand DynamoDB table '{TABLE_NAME}' in {REGION}.")


if __name__ == "__main__":
    try:
        main()
    except ClientError as error:
        print(f"AWS could not create the table: {error}", file=sys.stderr)
        raise SystemExit(1) from error
