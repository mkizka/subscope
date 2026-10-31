FROM grafana/grafana:12.2.1

ENV GF_SERVER_HTTP_PORT=8080

COPY provisioning /etc/grafana/provisioning
COPY dashboards /var/lib/grafana/dashboards

ENTRYPOINT ["sh", "-c", ": \"${GF_SECURITY_ADMIN_PASSWORD:?}\" && exec /run.sh"]
