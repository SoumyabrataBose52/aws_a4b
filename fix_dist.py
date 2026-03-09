import json

with open('dist.json', 'r') as f:
    data = json.load(f)

# Extract DistributionConfig
config = data['Distribution']['DistributionConfig']
etag = data['ETag']

# ALLViewer Origin Request Policy ID
# Managed-AllViewerExceptHostHeader
policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"

# Add OriginRequestPolicyId to the /api/* CacheBehavior
for behavior in config['CacheBehaviors']['Items']:
    if behavior['PathPattern'] == '/api/*':
        behavior['OriginRequestPolicyId'] = policy_id
        # When using Policies, we cannot use ForwardedValues, CloudFront handles it.
        if 'ForwardedValues' in behavior:
            del behavior['ForwardedValues']

with open('dist-config.json', 'w') as f:
    json.dump(config, f, indent=2)

with open('etag.txt', 'w') as f:
    f.write(etag)
