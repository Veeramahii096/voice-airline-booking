#!/bin/sh

echo "Configuring environment variables..."
echo "VITE_API_URL: $VITE_API_URL"
echo "VITE_NLP_URL: $VITE_NLP_URL"

# Replace environment variables in the built JavaScript files
if [ -n "$VITE_API_URL" ]; then
    echo "Replacing API URL..."
    find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|http://localhost:4000/api|$VITE_API_URL|g" {} \;
fi

if [ -n "$VITE_NLP_URL" ]; then
    echo "Replacing NLP URL..."
    find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|http://localhost:5000/api/nlp|$VITE_NLP_URL|g" {} \;
fi

echo "Starting nginx..."
# Start nginx
exec nginx -g "daemon off;"
