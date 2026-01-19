FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY osc-bridge.cjs ./

# Expose WebSocket port (default 8765)
# Note: OSC UDP ports are dynamic and configured at runtime
# Use host networking mode or expose UDP port range as needed
EXPOSE 8765

# Use host networking for UDP to work properly, or expose UDP ports
# For production, you may want to use a specific port range
# EXPOSE 8765/udp 5000-6000/udp

CMD ["npm", "start"]
