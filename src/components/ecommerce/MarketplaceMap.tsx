import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";

/* =========================================================
   PROPS
   ========================================================= */

interface MarketplaceMapProps {
  mapColor?: string;
}

/* =========================================================
   MARKETPLACE LOCATIONS

   Backend integration ke baad ye markers supplier /
   installer / marketplace coverage API se aa sakte hain.
   ========================================================= */

const marketplaceLocations = [
  {
    latLng: [31.5204, 74.3587],
    name: "Lahore",
    style: {
      fill: "#ff4b1f",
      borderWidth: 2,
      borderColor: "#ffffff",
      stroke: "#ff4b1f",
    },
  },
  {
    latLng: [24.8607, 67.0011],
    name: "Karachi",
    style: {
      fill: "#5b2eff",
      borderWidth: 2,
      borderColor: "#ffffff",
      stroke: "#5b2eff",
    },
  },
  {
    latLng: [33.6844, 73.0479],
    name: "Islamabad",
    style: {
      fill: "#ff4b1f",
      borderWidth: 2,
      borderColor: "#ffffff",
      stroke: "#ff4b1f",
    },
  },
  {
    latLng: [31.4504, 73.135],
    name: "Faisalabad",
    style: {
      fill: "#5b2eff",
      borderWidth: 2,
      borderColor: "#ffffff",
      stroke: "#5b2eff",
    },
  },
  {
    latLng: [30.1575, 71.5249],
    name: "Multan",
    style: {
      fill: "#ff4b1f",
      borderWidth: 2,
      borderColor: "#ffffff",
      stroke: "#ff4b1f",
    },
  },
  {
    latLng: [34.0151, 71.5249],
    name: "Peshawar",
    style: {
      fill: "#5b2eff",
      borderWidth: 2,
      borderColor: "#ffffff",
      stroke: "#5b2eff",
    },
  },
  {
    latLng: [30.1798, 66.975],
    name: "Quetta",
    style: {
      fill: "#ff4b1f",
      borderWidth: 2,
      borderColor: "#ffffff",
      stroke: "#ff4b1f",
    },
  },
];

/* =========================================================
   MARKETPLACE MAP
   ========================================================= */

export default function MarketplaceMap({
  mapColor,
}: MarketplaceMapProps) {
  return (
    <VectorMap
      map={worldMill}
      backgroundColor="transparent"

      markerStyle={{
        initial: {
          fill: "#ff4b1f",
          r: 5,
        } as any,

        hover: {
          fill: "#5b2eff",
          stroke: "#ffffff",
          strokeWidth: 2,
          cursor: "pointer",
        },
      }}

      markersSelectable={false}

      markers={marketplaceLocations}

      zoomOnScroll={false}

      zoomMax={12}

      zoomMin={1}

      zoomAnimate={true}

      zoomStep={1.5}

      regionStyle={{
        initial: {
          fill:
            mapColor ||
            "#D0D5DD",

          fillOpacity: 1,

          fontFamily:
            "Outfit",

          stroke: "#ffffff",

          strokeWidth: 0.4,

          strokeOpacity: 0.6,
        },

        hover: {
          fillOpacity: 0.8,

          cursor: "pointer",

          fill: "#5b2eff",

          stroke: "#ffffff",
        },

        selected: {
          fill: "#ff4b1f",
        },

        selectedHover: {
          fill: "#5b2eff",
        },
      }}

      regionLabelStyle={{
        initial: {
          fill: "#35373e",

          fontWeight: 500,

          fontSize: "12px",

          stroke: "none",
        },

        hover: {
          fill: "#ffffff",
        },

        selected: {
          fill: "#ffffff",
        },

        selectedHover: {
          fill: "#ffffff",
        },
      }}
    />
  );
}