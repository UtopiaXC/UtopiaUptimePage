FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for MySQL/MariaDB drivers if needed
RUN apt-get update && \
    apt-get install -y --no-install-recommends default-libmysqlclient-dev build-essential pkg-config && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install python dependencies including aiomysql for optional MariaDB support
RUN pip install --no-cache-dir -r requirements.txt aiomysql cryptography

COPY server.py .

# Default configuration for Docker environment
ENV KUMA_DATA_PATH=/data
ENV UTOPIA_PORT=55520
ENV UTOPIA_HOST=0.0.0.0

# Create volume mount point for Kuma data
VOLUME ["/data"]

EXPOSE 55520

CMD ["python", "server.py"]
