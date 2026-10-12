FROM python:3.12-slim
WORKDIR /app
COPY sapdt ./sapdt
COPY bd/sapdt.db ./bd/sapdt.db
ENV HOST=0.0.0.0
CMD ["python", "-m", "sapdt.api", "bd/sapdt.db"]
