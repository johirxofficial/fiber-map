from django.contrib.auth.hashers import PBKDF2PasswordHasher


class FastPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """PBKDF2 with a local-app friendly iteration count.

    The stock Django hasher uses 720,000 iterations, which can take ~20
    seconds per login on low-power Windows machines. Existing hashes remain
    verifiable because the iteration count is stored in the hash string.
    """

    iterations = 20000
