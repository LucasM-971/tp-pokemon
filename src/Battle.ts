import { Pokemon } from './Pokemon';
import { Trainer } from './Trainer';

export class Battle {
    static fight(first: Pokemon, second: Pokemon): Pokemon | null {
        let attacker = first;
        let defender = second;

        while (first.isAlive() && second.isAlive() && (first.canAttack() || second.canAttack())) {
            attacker.attack(defender);
            [attacker, defender] = [defender, attacker];
        }

        if (first.isAlive() && !second.isAlive()) return first;
        if (second.isAlive() && !first.isAlive()) return second;
        return null;
    }

    static duel(trainer1: Trainer, trainer2: Trainer, pokemon1: Pokemon, pokemon2: Pokemon): Trainer | null {
        const winner = Battle.fight(pokemon1, pokemon2);

        if (winner === pokemon1) {
            trainer1.gainExperience(1);
            return trainer1;
        }
        if (winner === pokemon2) {
            trainer2.gainExperience(1);
            return trainer2;
        }
        return null;
    }

    static bestTrainer(trainer1: Trainer, trainer2: Trainer): Trainer | null {
        if (trainer1.level !== trainer2.level) return trainer1.level > trainer2.level ? trainer1 : trainer2;
        if (trainer1.experience !== trainer2.experience) return trainer1.experience > trainer2.experience ? trainer1 : trainer2;
        return null;
    }

    static randomChallenge(trainer1: Trainer, trainer2: Trainer): Trainer | null {
        trainer1.healAtTavern();
        trainer2.healAtTavern();
        return Battle.duel(trainer1, trainer2, trainer1.getRandomPokemon(), trainer2.getRandomPokemon());
    }

    static arena1(trainer1: Trainer, trainer2: Trainer): Trainer | null {
        for (let i = 0; i < 100; i++) {
            Battle.randomChallenge(trainer1, trainer2);
        }
        return Battle.bestTrainer(trainer1, trainer2);
    }

    static deterministicChallenge(trainer1: Trainer, trainer2: Trainer): Trainer | null {
        return Battle.duel(trainer1, trainer2, trainer1.getStrongestPokemon(), trainer2.getStrongestPokemon());
    }

    static arena2(trainer1: Trainer, trainer2: Trainer): Trainer | null {
        for (let i = 0; i < 100; i++) {
            if (!trainer1.hasPokemonAlive() || !trainer2.hasPokemonAlive()) break;
            Battle.deterministicChallenge(trainer1, trainer2);
        }

        if (trainer1.hasPokemonAlive() && !trainer2.hasPokemonAlive()) return trainer1;
        if (trainer2.hasPokemonAlive() && !trainer1.hasPokemonAlive()) return trainer2;
        return Battle.bestTrainer(trainer1, trainer2);
    }
}
