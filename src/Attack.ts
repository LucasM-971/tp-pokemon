export class Attack {
    id?: number;
    name: string;
    damage: number;
    usageLimit: number;
    usageCount: number;

    constructor(name: string, damage: number, usageLimit: number, id?: number) {
        this.id = id;
        this.name = name;
        this.damage = damage;
        this.usageLimit = usageLimit;
        this.usageCount = 0;
    }

    canBeUsed(): boolean {
        return this.usageCount < this.usageLimit;
    }

    use() {
        this.usageCount++;
    }

    reset() {
        this.usageCount = 0;
    }

    getInfo(): string {
        return `${this.name} - dégâts : ${this.damage} - usages : ${this.usageCount}/${this.usageLimit}`;
    }
}
