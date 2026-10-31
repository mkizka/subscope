FROM grafana/grafana:12.2.1

COPY provisioning /etc/grafana/provisioning
COPY dashboards /var/lib/grafana/dashboards

ENTRYPOINT ["sh", "-c", ": \"${GF_SECURITY_ADMIN_PASSWORD:?}\" && GF_SERVER_HTTP_PORT=\"${PORT:-3000}\" exec /run.sh"]
