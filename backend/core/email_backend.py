"""
Custom email backend with SSL certificate verification options
"""
import ssl
from django.core.mail.backends.smtp import EmailBackend
from django.conf import settings


class BrevoEmailBackend(EmailBackend):
    """
    Custom SMTP backend for Brevo with SSL certificate handling
    """
    def __init__(self, host=None, port=None, username=None, password=None,
                 use_tls=None, fail_silently=False, use_ssl=None, timeout=None,
                 ssl_keyfile=None, ssl_certfile=None,
                 **kwargs):
        super().__init__(
            host, port, username, password,
            use_tls, fail_silently, use_ssl, timeout,
            ssl_keyfile, ssl_certfile, **kwargs
        )
        # Create SSL context that doesn't verify certificates (for development)
        # In production, you should use proper certificates
        if hasattr(settings, 'EMAIL_SSL_VERIFY') and not settings.EMAIL_SSL_VERIFY:
            self.connection = None
            self._connection_created = False
    
    def open(self):
        """
        Ensure we have a connection to the email server. Return whether or
        not a new connection was required (True or False) or None if an
        existing connection was tested.
        """
        if self.connection:
            # Nothing to do if the connection is already open.
            return None

        # If local_settings has a certificate verification setting, use it
        email_ssl_verify = getattr(settings, 'EMAIL_SSL_VERIFY', True)
        
        connection_params = {}
        if self.timeout is not None:
            connection_params['timeout'] = self.timeout
        if self.use_ssl:
            connection_params['ssl_context'] = ssl.create_default_context()
            if not email_ssl_verify:
                # For development: disable certificate verification
                connection_params['ssl_context'].check_hostname = False
                connection_params['ssl_context'].verify_mode = ssl.CERT_NONE
        try:
            self.connection = self.connection_class(
                self.host, self.port, **connection_params
            )
            # Set TLS context if using STARTTLS
            if self.use_tls:
                context = ssl.create_default_context()
                if not email_ssl_verify:
                    # For development: disable certificate verification
                    context.check_hostname = False
                    context.verify_mode = ssl.CERT_NONE
                self.connection.starttls(context=context)
            
            # Authenticate if credentials are provided
            if self.username and self.password:
                self.connection.login(self.username, self.password)
        except Exception:
            if not self.fail_silently:
                raise
            return None

        return True
