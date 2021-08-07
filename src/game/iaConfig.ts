import createGenerator from "seedrandom";

export interface ConfigData extends Omit<IAConfig, "toString"> {}

export class IAConfig {
    nbClearedRowsFactor: number;
    nbHolesFactor: number;
    cumulativeHeightFactor: number;
    bumpinessFactor: number;

    constructor(baseConfig: Partial<ConfigData> = {}) {
        this.nbClearedRowsFactor =
            baseConfig.nbClearedRowsFactor || randomWeight();
        this.nbHolesFactor = baseConfig.nbHolesFactor || randomWeight();
        this.cumulativeHeightFactor =
            baseConfig.cumulativeHeightFactor || randomWeight();
        this.bumpinessFactor = baseConfig.bumpinessFactor || randomWeight();
    }

    toString() {
        return Object.entries(this)
            .map(([key, value]) => key + ": " + String(value))
            .join(", ");
    }

    normalize() {
        const norm = Object.values({ ...this }).reduce(
            (acc, value) => acc + Math.pow(value, 2),
            0
        );
        Object.entries({ ...this }).forEach(
            ([key, value]) => (this[key] = value / norm)
        );
    }
}

export const random = () => Math.random();
export const randomWeight = () => Math.random() - 0.5;
