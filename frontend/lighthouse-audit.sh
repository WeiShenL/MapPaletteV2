#!/bin/bash

# MapPalette V2 - Lighthouse Performance Audit Script
# This script runs Lighthouse audits on the deployed application

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 MapPalette V2 - Lighthouse Performance Audit"
echo "==============================================="
echo

# Check if lighthouse CLI is installed
if ! command -v lighthouse &> /dev/null; then
    echo -e "${RED}❌ Lighthouse CLI is not installed${NC}"
    echo
    echo "Install it with:"
    echo "  npm install -g lighthouse"
    echo
    exit 1
fi

# Get the URL to audit (default to localhost)
URL="${1:-http://localhost:3000}"
OUTPUT_DIR="${2:-./lighthouse-reports}"

echo -e "${YELLOW}📊 Audit Configuration:${NC}"
echo "  URL: $URL"
echo "  Output Directory: $OUTPUT_DIR"
echo

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate timestamp for reports
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo -e "${YELLOW}🚀 Running Lighthouse audits...${NC}"
echo

# Function to run audit
run_audit() {
    local device=$1
    local url=$2
    local output_path="$OUTPUT_DIR/lighthouse-${device}-${TIMESTAMP}"

    echo -e "${YELLOW}▶ Running ${device} audit for: ${url}${NC}"

    if [ "$device" == "mobile" ]; then
        lighthouse "$url" \
            --output html \
            --output json \
            --output-path "$output_path" \
            --preset=perf \
            --screenEmulation.mobile \
            --formFactor=mobile \
            --throttling.cpuSlowdownMultiplier=4 \
            --quiet
    else
        lighthouse "$url" \
            --output html \
            --output json \
            --output-path "$output_path" \
            --preset=perf \
            --screenEmulation.disabled \
            --formFactor=desktop \
            --throttling.cpuSlowdownMultiplier=1 \
            --quiet
    fi

    echo -e "${GREEN}✓ ${device} audit complete${NC}"
    echo "  HTML Report: ${output_path}.report.html"
    echo "  JSON Report: ${output_path}.report.json"
    echo
}

# Run audits for different pages
PAGES=(
    "$URL"
    "$URL/login"
    "$URL/signup"
    "$URL/homepage"
)

for page in "${PAGES[@]}"; do
    # Run desktop audit
    run_audit "desktop" "$page"

    # Run mobile audit
    run_audit "mobile" "$page"
done

# Parse JSON results and display summary
echo
echo -e "${GREEN}📊 Audit Summary${NC}"
echo "===================="
echo

# Function to extract score from JSON
extract_score() {
    local json_file=$1
    local category=$2

    if [ -f "$json_file" ]; then
        python3 -c "import json; data=json.load(open('$json_file')); print(int(data['categories']['$category']['score'] * 100))" 2>/dev/null || echo "N/A"
    else
        echo "N/A"
    fi
}

# Display summary for latest reports
LATEST_DESKTOP="$OUTPUT_DIR/lighthouse-desktop-${TIMESTAMP}.report.json"
LATEST_MOBILE="$OUTPUT_DIR/lighthouse-mobile-${TIMESTAMP}.report.json"

if [ -f "$LATEST_DESKTOP" ]; then
    PERF=$(extract_score "$LATEST_DESKTOP" "performance")
    ACC=$(extract_score "$LATEST_DESKTOP" "accessibility")
    BP=$(extract_score "$LATEST_DESKTOP" "best-practices")
    SEO=$(extract_score "$LATEST_DESKTOP" "seo")

    echo -e "${YELLOW}Desktop Scores (Home Page):${NC}"
    echo "  Performance:     $PERF/100"
    echo "  Accessibility:   $ACC/100"
    echo "  Best Practices:  $BP/100"
    echo "  SEO:             $SEO/100"
    echo

    # Check if scores meet targets (90+)
    if [ "$PERF" -ge 90 ] && [ "$ACC" -ge 90 ] && [ "$BP" -ge 90 ] && [ "$SEO" -ge 95 ]; then
        echo -e "${GREEN}✅ All targets met! (Performance: 90+, Accessibility: 90+, Best Practices: 90+, SEO: 95+)${NC}"
    else
        echo -e "${RED}⚠️  Some scores below target${NC}"
        echo "   Targets: Performance 90+, Accessibility 90+, Best Practices 90+, SEO 95+"
    fi
    echo
fi

if [ -f "$LATEST_MOBILE" ]; then
    PERF=$(extract_score "$LATEST_MOBILE" "performance")
    ACC=$(extract_score "$LATEST_MOBILE" "accessibility")
    BP=$(extract_score "$LATEST_MOBILE" "best-practices")
    SEO=$(extract_score "$LATEST_MOBILE" "seo")

    echo -e "${YELLOW}Mobile Scores (Home Page):${NC}"
    echo "  Performance:     $PERF/100"
    echo "  Accessibility:   $ACC/100"
    echo "  Best Practices:  $BP/100"
    echo "  SEO:             $SEO/100"
    echo
fi

echo -e "${GREEN}✅ Lighthouse audit complete!${NC}"
echo
echo "View reports in: $OUTPUT_DIR"
echo

# Open the latest HTML report if on macOS or Linux with xdg-open
if command -v xdg-open &> /dev/null; then
    echo "Opening latest report..."
    xdg-open "$OUTPUT_DIR/lighthouse-desktop-${TIMESTAMP}.report.html" &> /dev/null &
elif command -v open &> /dev/null; then
    echo "Opening latest report..."
    open "$OUTPUT_DIR/lighthouse-desktop-${TIMESTAMP}.report.html" &> /dev/null &
fi
