import { describe, expect, it } from "vitest";
import {
  compareFieldLabels,
  fieldChipLabel,
  groundDirectionsHref,
  groundEmbedSrc,
  groundMapsHref,
  splitGroundName,
} from "@/lib/grounds";

describe("fieldChipLabel", () => {
  it("names numbered fields and single-field grounds", () => {
    expect(fieldChipLabel("3")).toBe("Field 3");
    expect(fieldChipLabel("")).toBe("Single field");
    expect(fieldChipLabel("  ")).toBe("Single field");
  });
});

describe("groundMapsHref", () => {
  it("prefers the saved maps URL", () => {
    expect(groundMapsHref({ name: "Larry Bell", address: "x", mapsUrl: "https://maps.example/lb" })).toBe(
      "https://maps.example/lb",
    );
  });

  it("searches the address, or the name when there is no address", () => {
    expect(
      groundMapsHref({ name: "RAP", address: "10495 Woodstock Rd, Roswell, GA 30075", mapsUrl: null }),
    ).toBe(
      "https://www.google.com/maps/search/?api=1&query=10495%20Woodstock%20Rd%2C%20Roswell%2C%20GA%2030075",
    );
    expect(groundMapsHref({ name: "Ocee Park", address: null, mapsUrl: null })).toBe(
      "https://www.google.com/maps/search/?api=1&query=Ocee%20Park",
    );
  });
});

describe("compareFieldLabels", () => {
  it("sorts numbers numerically, before other labels", () => {
    expect(["10", "2", "A", "1", ""].sort(compareFieldLabels)).toEqual(
      ["1", "2", "10", "", "A"].sort(compareFieldLabels),
    );
    expect(["10", "2", "1"].sort(compareFieldLabels)).toEqual(["1", "2", "10"]);
    expect(["B", "2", "A"].sort(compareFieldLabels)).toEqual(["2", "A", "B"]);
  });
});

describe("splitGroundName", () => {
  it("splits a trailing field number off the ground", () => {
    expect(splitGroundName("Nickajack Park 3")).toEqual({ ground: "Nickajack Park", label: "3" });
    expect(splitGroundName("Harrison Field 6")).toEqual({ ground: "Harrison Field", label: "6" });
    expect(splitGroundName("ERP 1")).toEqual({ ground: "ERP", label: "1" });
  });

  it("treats a name with no trailing number as a single-field ground", () => {
    expect(splitGroundName("Larry Bell")).toEqual({ ground: "Larry Bell", label: "" });
    expect(splitGroundName("  Lions Park ")).toEqual({ ground: "Lions Park", label: "" });
  });
});

describe("map links", () => {
  const rap = { name: "RAP", address: "10495 Woodstock Rd, Roswell, GA 30075" };

  it("embeds a map for the address, with the pin Google puts on it", () => {
    expect(groundEmbedSrc(rap)).toBe(
      "https://www.google.com/maps?q=10495%20Woodstock%20Rd%2C%20Roswell%2C%20GA%2030075&output=embed",
    );
  });

  it("uses coordinates when the ground has them, and the name when it has nothing else", () => {
    expect(groundEmbedSrc({ ...rap, latitude: 34.0123, longitude: -84.3456 })).toBe(
      "https://www.google.com/maps?q=34.0123%2C-84.3456&output=embed",
    );
    expect(groundEmbedSrc({ name: "Ocee Park", address: null })).toBe(
      "https://www.google.com/maps?q=Ocee%20Park&output=embed",
    );
  });

  it("links directions to the same place", () => {
    expect(groundDirectionsHref(rap)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=10495%20Woodstock%20Rd%2C%20Roswell%2C%20GA%2030075",
    );
  });
});
