# MatchNearby API — Production Container
# Build:  docker build -t matchnearby-api .
# Run:    docker run -p 8000:8000 --env-file .env matchnearby-api

# Start with a minimal Python image (~150MB vs ~900MB for the full image).
FROM python:3.12-slim

WORKDIR /app

# Copy requirements first, then install.
# Docker caches each layer — if requirements.txt hasn't changed,
# this step is skipped on rebuild, saving minutes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code.
COPY . .

# Start the server. 0.0.0.0 is required so the container accepts
# external connections (Railway routes internet traffic into the container).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
