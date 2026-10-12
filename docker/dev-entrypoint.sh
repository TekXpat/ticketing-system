#!/bin/sh
# Development container entrypoint.
set -e

# Run as whoever owns the working tree. On Linux the bind-mounted checkout
# belongs to the host user, whose uid varies (1000, 1001, root...); matching it
# lets the container write src/generated and new migrations, and keeps those
# files owned by you. The named volumes are handed to that uid the first time.
owner_uid=$(stat -c %u /app)
owner_gid=$(stat -c %g /app)
if [ "$(id -u)" = 0 ] && [ "$owner_uid" != 0 ]; then
  for dir in node_modules .next; do
    if [ -d "$dir" ] && [ "$(stat -c %u "$dir")" != "$owner_uid" ]; then
      chown -R "$owner_uid:$owner_gid" "$dir"
    fi
  done
  export HOME="/tmp/home-$owner_uid"
  mkdir -p "$HOME" && chown "$owner_uid:$owner_gid" "$HOME"
  exec setpriv --reuid="$owner_uid" --regid="$owner_gid" --clear-groups "$0" "$@"
fi

# node_modules lives in a named volume so Linux binaries never mix with the
# host's. When package-lock.json changes, reinstall into that volume.
lock_hash=$(sha256sum package-lock.json | cut -d' ' -f1)
if [ "$(cat node_modules/.lock-hash 2>/dev/null)" != "$lock_hash" ]; then
  echo "package-lock.json changed; running npm ci"
  npm ci
  echo "$lock_hash" > node_modules/.lock-hash
fi

# The Prisma client is generated into src/, which the bind mount replaces.
npx prisma generate > /dev/null

exec "$@"
