#!/bin/bash

# Setup script for running GitHub Actions locally with 'act'

echo "🚀 Setting up 'act' to run GitHub Actions locally..."

# Check if act is installed
if command -v act &> /dev/null; then
    echo "✅ act is already installed"
else
    echo "📦 Installing act..."
    
    # Install act based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install act
        else
            echo "❌ Homebrew not found. Please install Homebrew first: https://brew.sh/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
    else
        echo "❌ Unsupported OS. Please install act manually: https://github.com/nektos/act"
        exit 1
    fi
fi

# Create .actrc configuration file
cat > .actrc << EOF
# act configuration for BetterAI
-P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-latest
--container-daemon-socket -
EOF

echo "✅ act setup complete!"
echo ""
echo "📖 Usage:"
echo "  Run all workflows: act"
echo "  Run CI workflow: act -W .github/workflows/ci.yml"
echo "  Run specific job: act -j lint-and-typecheck"
echo "  List available jobs: act -l"
echo ""