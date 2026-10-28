from django.contrib.auth.hashers import PBKDF2PasswordHasher


class FastPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """PBKDF2 with a smaller iteration count than Django's 720,000 default.

    The stock hasher can take ~20 seconds per login on very low-power Windows
    machines, which made the portal unusable there.  210,000 iterations keeps
    logins responsive while still being far too slow for a leaked database to
    be brute-forced at scale.  The iteration count is stored in every hash, so
    older hashes stay verifiable and Django silently upgrades them on the next
    successful login.
    """

    iterations = 210000
