#!/usr/bin/env bash
# Install fiber-map as a systemd service.  Run from the project directory:
#
#   sudo bash deploy/install-service.sh /opt/fiber-map fibermap 5003
#
# The user must already exist (for example: sudo useradd --system --create-home fibermap).
# The project directory must be owned by that user.
set -euo pipefail

APP_DIR="${1:-${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}}"
APP_USER="${2:-${APP_USER:-${SUDO_USER:-$USER}}}"
PORT="${3:-${PORT:-5003}}"
SERVICE_NAME="${SERVICE_NAME:-fiber-map}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
TEMPLATE="${APP_DIR}/deploy/fiber-map.service"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi
if [[ ! -f "${APP_DIR}/manage.py" ]]; then
  echo "Project not found at ${APP_DIR}" >&2
  exit 1
fi
if ! id "${APP_USER}" >/dev/null 2>&1; then
  echo "Linux user '${APP_USER}' does not exist. Create it first." >&2
  exit 1
fi
if [[ ! -f "${TEMPLATE}" ]]; then
  echo "Missing ${TEMPLATE}" >&2
  exit 1
fi
if ! [[ "${PORT}" =~ ^[0-9]+$ ]] || (( PORT < 1 || PORT > 65535 )); then
  echo "Port must be between 1 and 65535." >&2
  exit 1
fi

echo "==> Creating Python virtual environment"
if [[ ! -x "${APP_DIR}/.venv/bin/python" ]]; then
  sudo -u "${APP_USER}" "${PYTHON_BIN}" -m venv "${APP_DIR}/.venv"
fi

echo "==> Installing Python dependencies"
sudo -u "${APP_USER}" "${APP_DIR}/.venv/bin/python" -m pip install --upgrade pip
sudo -u "${APP_USER}" "${APP_DIR}/.venv/bin/pip" install -r "${APP_DIR}/requirements.txt"

echo "==> Preparing database and static files"
sudo -u "${APP_USER}" env \
  DJANGO_SETTINGS_MODULE=fibermap.settings \
  DJANGO_DEBUG=0 \
  "${APP_DIR}/.venv/bin/python" "${APP_DIR}/manage.py" migrate --noinput
sudo -u "${APP_USER}" env \
  DJANGO_SETTINGS_MODULE=fibermap.settings \
  DJANGO_DEBUG=0 \
  "${APP_DIR}/.venv/bin/python" "${APP_DIR}/manage.py" collectstatic --noinput

echo "==> Saving web port ${PORT}"
sudo -u "${APP_USER}" env PYTHONPATH="${APP_DIR}" \
  "${APP_DIR}/.venv/bin/python" -c \
  "from map.site_config import write_config; write_config({'port': ${PORT}})"

echo "==> Writing ${SERVICE_FILE}"
sed \
  -e "s|__APP_DIR__|${APP_DIR}|g" \
  -e "s|__APP_USER__|${APP_USER}|g" \
  "${TEMPLATE}" > "${SERVICE_FILE}"

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}"

echo
echo "fiber-map is enabled and running."
echo "  service: systemctl status ${SERVICE_NAME}"
echo "  logs:    journalctl -u ${SERVICE_NAME} -f"
echo "  url:     http://127.0.0.1:${PORT}/"
echo
echo "After changing the port in Management, run.py restarts the web child"
echo "automatically. If the service itself needs a restart, use:"
echo "  sudo systemctl restart ${SERVICE_NAME}"
