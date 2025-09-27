# Security Policy

## Reporting a Vulnerability

We take the security of AstroWeather seriously. If you believe you've found a security vulnerability in our application, please follow these steps to report it:

1. **Do not disclose the vulnerability publicly** until it has been addressed by our team.

2. **Email the details to**: security@example.com (replace with your actual contact email)
   - Include a detailed description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact of the vulnerability
   - Any suggestions for mitigating or fixing the issue

3. You should receive an acknowledgment of your report within 48 hours.

4. We will investigate all legitimate reports and do our best to quickly fix the problem.

## Security Considerations

### API Keys

This application uses the OpenWeatherMap API which requires an API key. Please note:

- Never commit your API key to the repository
- Store your API key in a secure environment variable or configuration file that is not tracked by version control
- Consider using API key rotation for production deployments

### Data Privacy

AstroWeather:
- Does not collect or store personal user data
- Only makes API calls to OpenWeatherMap when a user interacts with the globe
- Does not track user location unless explicitly searched for by the user

## Supported Versions

Only the latest version of AstroWeather is currently supported with security updates.

## Security Best Practices for Deployment

When deploying AstroWeather to production, consider the following security best practices:

1. Use HTTPS to secure all communications
2. Implement proper Content Security Policy (CSP) headers
3. Keep all dependencies updated to their latest secure versions
4. Consider implementing rate limiting if exposing to public internet
5. Use subresource integrity checks for third-party resources

## Acknowledgments

We would like to thank the following individuals for their contributions to the security of AstroWeather:

- (This section will be updated as security researchers contribute)

## License

The security policy is part of the AstroWeather project and is covered by the same MIT License.
