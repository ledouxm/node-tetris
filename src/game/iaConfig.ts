import createGenerator from "seedrandom";

export interface ConfigData extends Omit<IAConfig, "toString"> {}

export class IAConfig {
    nbClearedRowsFactor: number;
    nbHolesFactor: number;
    weightedHeightFactor: number;
    cumulativeHeightFactor: number;
    relativeHeightFactor: number;
    roughnessFactor: number;

    constructor(baseConfig: Partial<ConfigData> = {}) {
        this.nbClearedRowsFactor = baseConfig.nbClearedRowsFactor || randomWeight();
        this.nbHolesFactor = baseConfig.nbHolesFactor || randomWeight();
        this.weightedHeightFactor = baseConfig.weightedHeightFactor || randomWeight();
        this.cumulativeHeightFactor = baseConfig.cumulativeHeightFactor || randomWeight();
        this.relativeHeightFactor = baseConfig.relativeHeightFactor || randomWeight();
        this.roughnessFactor = baseConfig.roughnessFactor || randomWeight();
    }

    toString() {
        return Object.entries(this)
            .map(([key, value]) => key + ": " + String(value))
            .join(", ");
    }
}

export const random = () => createGenerator()();
export const randomWeight = () => createGenerator()() * 2 - 1;
