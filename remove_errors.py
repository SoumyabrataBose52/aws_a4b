import json

with open('dist.json', 'r') as f:
    data = json.load(f)

# Extract DistributionConfig
config = data['Distribution']['DistributionConfig']
etag = data['ETag']

# Remove CustomErrorResponses if present
if 'CustomErrorResponses' in config:
    config['CustomErrorResponses'] = {'Quantity': 0}

with open('clean-config.json', 'w') as f:
    json.dump(config, f, indent=2)

with open('etag.txt', 'w') as f:
    f.write(etag)
