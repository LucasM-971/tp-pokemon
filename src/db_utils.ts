import { Client } from 'pg';
import { Attack } from './Attack';
import { Pokemon } from './Pokemon';
import { Trainer } from './Trainer';

function getConnection() {
    return new Client({
        host: 'localhost',
        user: process.env.dbuser,
        password: process.env.dbpwd,
        database: 'mabase',
        port: 5432
    });
}

async function query(sql: string, params: any[] = []) {
    const client = getConnection();
    await client.connect();
    try {
        const result = await client.query(sql, params);
        return result.rows;
    } finally {
        await client.end();
    }
}

function toAttack(row: any): Attack {
    const attack = new Attack(row.name, row.damage, row.usage_limit, row.id);
    attack.usageCount = row.usage_count ?? 0;
    return attack;
}

async function toPokemon(row: any): Promise<Pokemon> {
    const pokemon = new Pokemon(row.name, row.max_life_point, row.id);
    pokemon.lifePoint = row.life_point;

    const attacks = await query(
        'SELECT attacks.*, pokemon_attacks.usage_count FROM attacks JOIN pokemon_attacks ON pokemon_attacks.attack_id = attacks.id WHERE pokemon_attacks.pokemon_id = $1 ORDER BY attacks.id',
        [row.id]
    );
    attacks.forEach(attack => pokemon.learnAttack(toAttack(attack)));
    return pokemon;
}

async function toTrainer(row: any): Promise<Trainer> {
    const trainer = new Trainer(row.name, row.level, row.experience, row.id);

    const pokemons = await query('SELECT * FROM pokemons WHERE trainer_id = $1 ORDER BY id', [row.id]);
    for (const pokemon of pokemons) {
        trainer.addPokemon(await toPokemon(pokemon));
    }
    return trainer;
}

export async function getAttacks(): Promise<Attack[]> {
    const rows = await query('SELECT * FROM attacks ORDER BY id');
    return rows.map(toAttack);
}

export async function getAttack(attackId: number): Promise<Attack | null> {
    const rows = await query('SELECT * FROM attacks WHERE id = $1', [attackId]);
    return rows.length ? toAttack(rows[0]) : null;
}

export async function insertAttack(attack: Attack) {
    const rows = await query(
        'INSERT INTO attacks (name, damage, usage_limit) VALUES ($1, $2, $3) RETURNING id',
        [attack.name, attack.damage, attack.usageLimit]
    );
    attack.id = rows[0].id;
}

export async function getPokemon(pokemonId: number): Promise<Pokemon | null> {
    const rows = await query('SELECT * FROM pokemons WHERE id = $1', [pokemonId]);
    return rows.length ? toPokemon(rows[0]) : null;
}

export async function insertPokemon(pokemon: Pokemon, trainerId: number) {
    const rows = await query(
        'INSERT INTO pokemons (name, life_point, max_life_point, trainer_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [pokemon.name, pokemon.lifePoint, pokemon.maxLifePoint, trainerId]
    );
    pokemon.id = rows[0].id;
}

export async function insertPokemonAttack(pokemon: Pokemon, attack: Attack) {
    await query('INSERT INTO pokemon_attacks (pokemon_id, attack_id) VALUES ($1, $2)', [pokemon.id, attack.id]);
}

export async function savePokemon(pokemon: Pokemon) {
    await query('UPDATE pokemons SET life_point = $1 WHERE id = $2', [pokemon.lifePoint, pokemon.id]);
    for (const attack of pokemon.attacks) {
        await query(
            'UPDATE pokemon_attacks SET usage_count = $1 WHERE pokemon_id = $2 AND attack_id = $3',
            [attack.usageCount, pokemon.id, attack.id]
        );
    }
}

export async function getTrainers(): Promise<Trainer[]> {
    const rows = await query('SELECT * FROM trainers ORDER BY id');
    const trainers = [];
    for (const row of rows) {
        trainers.push(await toTrainer(row));
    }
    return trainers;
}

export async function getTrainer(trainerId: number): Promise<Trainer | null> {
    const rows = await query('SELECT * FROM trainers WHERE id = $1', [trainerId]);
    return rows.length ? toTrainer(rows[0]) : null;
}

export async function insertTrainer(trainer: Trainer) {
    const rows = await query(
        'INSERT INTO trainers (name, level, experience) VALUES ($1, $2, $3) RETURNING id',
        [trainer.name, trainer.level, trainer.experience]
    );
    trainer.id = rows[0].id;
}

export async function saveTrainer(trainer: Trainer) {
    await query('UPDATE trainers SET level = $1, experience = $2 WHERE id = $3', [trainer.level, trainer.experience, trainer.id]);
    for (const pokemon of trainer.pokemons) {
        await savePokemon(pokemon);
    }
}
