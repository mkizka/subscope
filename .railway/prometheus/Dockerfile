FROM prom/prometheus:v3.1.0

COPY prometheus.yml /etc/prometheus/prometheus.yml

USER root
CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus", "--storage.tsdb.retention.time=90d", "--storage.tsdb.retention.size=1500MB", "--web.listen-address=[::]:9090"]
