#!/bin/bash

# Documentation Evolution Status Check Script

echo "📊 Documentation Evolution Status Check"
echo "======================================"
echo ""

# Check if orchestration directory exists
if [ ! -d "/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution/orchestration" ]; then
    echo "❌ Orchestration directory not found!"
    exit 1
fi

cd /home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution/orchestration

# Check context manifest
echo "📋 Phase Status:"
if [ -f "context/context-manifest.json" ]; then
    jq -r '.phases | to_entries[] | "  \(.key): \(.value.status)"' context/context-manifest.json
else
    echo "  ❌ Context manifest not found"
fi
echo ""

# Check metrics
echo "📈 Global Metrics:"
if [ -f "metrics/tracking-system.json" ]; then
    jq -r '.globalMetrics | "  Total Executions: \(.totalExecutions)\n  Successful: \(.successfulExecutions)\n  Failed: \(.failedExecutions)"' metrics/tracking-system.json
else
    echo "  ❌ Metrics tracking not found"
fi
echo ""

# Check outputs
echo "📁 Output Directories:"
for phase in 1-discovery 2-synthesis 3-documentation 4-validation 5-integration; do
    if [ -d "outputs/$phase" ]; then
        count=$(find "outputs/$phase" -type f 2>/dev/null | wc -l)
        echo "  $phase: $count files"
    else
        echo "  $phase: ❌ Not found"
    fi
done
echo ""

# Check knowledge accumulation
echo "🧠 Knowledge Base:"
if [ -f "context/accumulation/knowledge-base.json" ]; then
    jq -r '.metadata | "  Total Items: \(.totalItems)\n  Last Updated: \(.lastUpdated // "Never")"' context/accumulation/knowledge-base.json
else
    echo "  ❌ Knowledge base not found"
fi
echo ""

echo "✅ Status check complete!"
echo ""
echo "To start evolution, run:"
echo "  /infinite-documentation mode=orchestrated output_dir=/home/loucmane/dev/javascript/MomsBlog/blog/docs/evolution count=1"