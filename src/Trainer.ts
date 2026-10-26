import { Pokemon } from './Pokemon';

export class Trainer {
    id?: number;
    name: string;
    level: number;
    experience: number;
    pokemons: Pokemon[];

    constructor(name: string, level = 1, experience = 0, id?: number) {
        this.id = id;
        this.name = name;
        this.level = level;
        this.experience = experience;
        this.pokemons = [];
    }

    addPokemon(pokemon: Pokemon) {
        this.pokemons.push(pokemon);
    }

    healAtTavern() {
        this.pokemons.forEach(pokemon => pokemon.heal());
    }

    gainExperience(amount: number) {
        this.experience += amount;
        while (this.experience >= 10) {
            this.level++;
            this.experience -= 10;
        }
    }

    hasPokemonAlive(): boolean {
        return this.pokemons.some(pokemon => pokemon.isAlive());
    }

    getRandomPokemon(): Pokemon {
        return this.pokemons[Math.floor(Math.random() * this.pokemons.length)];
    }

    getStrongestPokemon(): Pokemon {
        return this.pokemons.reduce((best, pokemon) => pokemon.lifePoint > best.lifePoint ? pokemon : best);
    }
}
