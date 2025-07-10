import os
print('IS_RAILWAY detection:')
print('  RAILWAY_ENVIRONMENT:', os.getenv('RAILWAY_ENVIRONMENT'))
print('  RAILWAY_PROJECT_ID:', os.getenv('RAILWAY_PROJECT_ID'))
print('  RAILWAY_SERVICE_ID:', os.getenv('RAILWAY_SERVICE_ID'))
print()
print('CORS variable:')
print('  Raw CORS_ALLOWED_ORIGINS:', repr(os.getenv('CORS_ALLOWED_ORIGINS')))
if os.getenv('CORS_ALLOWED_ORIGINS'):
    origins = os.getenv('CORS_ALLOWED_ORIGINS').split(',')
    print('  Split origins:', origins)
    print('  Number of origins:', len(origins))
else:
    print('  No CORS variable found')
