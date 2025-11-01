import { useEffect } from "react";

export default function AdBlockDetector({ onAdBlockDetected }) {
  useEffect(() => {
    const detectAdBlock = async () => {
      try {
        // Create a bait element that looks like an ad
        const bait = document.createElement('div');
        bait.className = 'ad ads adsbox ad-placement ad-placeholder adbadge BannerAd';
        bait.style.cssText = 'height: 1px !important; width: 1px !important; position: absolute !important; left: -10000px !important;';
        document.body.appendChild(bait);

        // Wait a moment for ad blockers to do their thing
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if the element was blocked
        const isBlocked = bait.offsetHeight === 0 || bait.offsetParent === null;
        
        document.body.removeChild(bait);

        if (isBlocked) {
          onAdBlockDetected();
        }
      } catch (error) {
        console.error('Error detecting adblock:', error);
      }
    };

    detectAdBlock();
  }, [onAdBlockDetected]);

  return null;
}