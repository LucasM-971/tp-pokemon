import { Attack } from './Attack';

export class Pokemon {
    id?: number;
    name: string;
    lifePoint: number;
    maxLifePoint: number;
    attacks: Attack[];

    constructor(name: string, lifePoint: number, id?: number) {
        this.id = id;
        this.name = name;
        this.lifePoint = lifePoint;
        this.maxLifePoint = lifePoint;
        this.attacks = [];
    }

    learnAttack(attack: Attack): boolean {
        if (this.attacks.length >= 4) return false;
        if (this.attacks.some(a => a.name === attack.name)) return false;
        this.attacks.push(attack);
        return true;
    }

    heal() {
        this.lifePoint = this.maxLifePoint;
        this.attacks.forEach(attack => attack.reset());
    }

    isAlive(): boolean {
        return this.lifePoint > 0;
    }

    canAttack(): boolean {
        return this.attacks.some(attack => attack.canBeUsed());
    }

    attack(target: Pokemon): Attack | null {
        const availableAttacks = this.attacks.filter(attack => attack.canBeUsed());
        if (availableAttacks.length === 0) return null;

        const attack = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
        attack.use();
        target.lifePoint = Math.max(0, target.lifePoint - attack.damage);
        return attack;
    }
}
