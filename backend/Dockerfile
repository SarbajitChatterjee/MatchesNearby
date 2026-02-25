# 1. Start with a lightweight, official Python base image
FROM python:3.12-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Prevent Python from writing .pyc files to disk and ensure console output isn't buffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 4. Copy ONLY the requirements file first to leverage Docker layer caching
COPY requirements.txt .

# 5. Install dependencies
# --no-cache-dir keeps the image small by not storing the downloaded pip packages
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of the application code
COPY . .

# 7. Expose the port the app runs on
EXPOSE 8000

# 8. Define the command to run the FastAPI app using Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]