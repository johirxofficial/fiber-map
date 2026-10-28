FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    DJANGO_DEBUG=0 \
    DJANGO_SETTINGS_MODULE=fibermap.settings

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential default-libmysqlclient-dev pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput || true
RUN rm -f site_config.json

EXPOSE 5003
CMD ["python", "run.py", "--host", "0.0.0.0"]
