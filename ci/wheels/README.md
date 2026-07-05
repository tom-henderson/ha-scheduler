# Vendored CI wheels

`pytest-homeassistant-custom-component` pulls two dependencies whose PyPI
releases ship only an sdist that fails to build under modern setuptools
(their `setup.py` references the Debian-only `install_layout` attribute):

- **PyRIC** (transitively, via `bluetooth-auto-recovery`)
- **mock-open**

Both are pure-Python, so we vendor universal wheels here and point pip at them
with `--find-links ci/wheels` in CI. This keeps the test install deterministic
on GitHub runners without patching setuptools.
