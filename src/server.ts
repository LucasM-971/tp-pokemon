import express, { Request, Response } from 'express';
import { Attack } from './Attack';
import { Pokemon } from './Pokemon';
import { Trainer } from './Trainer';
import { Battle } from './Battle';
import {
    getAttacks, getAttack, insertAttack,
    getPokemon, insertPokemon, insertPokemonAttack, savePokemon,
    getTrainers, getTrainer, insertTrainer, saveTrainer
} from './db_utils';

const app = express();
const port = 3000;

app.use(express.json());

function loggerMiddleware(req: Request, res: Response, next: () => void) {
    console.log(`Nouvelle requete entrante : ${req.method} ${req.url}`);
    next();
}

app.use(loggerMiddleware);

app.get('/attacks', async (req, res) => {
    res.json(await getAttacks());
});

app.post('/attacks', async (req, res) => {
    const attack = new Attack(req.body.name, req.body.damage, req.body.usageLimit);
    await insertAttack(attack);
    res.status(201).json(attack);
});

app.get('/pokemons/:pokemonId', async (req, res) => {
    const pokemon = await getPokemon(Number(req.params.pokemonId));
    if (!pokemon) {
        res.status(404).send('Pokemon not found');
        return;
    }
    res.json(pokemon);
});

app.post('/pokemons/:pokemonId/attacks', async (req, res) => {
    const pokemon = await getPokemon(Number(req.params.pokemonId));
    const attack = await getAttack(req.body.attackId);
    if (!pokemon || !attack) {
        res.status(404).send('Pokemon or attack not found');
        return;
    }
    if (!pokemon.learnAttack(attack)) {
        res.status(400).send('Le pokemon connait deja cette attaque ou a deja 4 attaques');
        return;
    }
    await insertPokemonAttack(pokemon, attack);
    res.json(pokemon);
});

app.post('/pokemons/:pokemonId/heal', async (req, res) => {
    const pokemon = await getPokemon(Number(req.params.pokemonId));
    if (!pokemon) {
        res.status(404).send('Pokemon not found');
        return;
    }
    pokemon.heal();
    await savePokemon(pokemon);
    res.json(pokemon);
});

app.post('/pokemons/:pokemonId/attack/:targetId', async (req, res) => {
    const pokemon = await getPokemon(Number(req.params.pokemonId));
    const target = await getPokemon(Number(req.params.targetId));
    if (!pokemon || !target) {
        res.status(404).send('Pokemon not found');
        return;
    }
    const attack = pokemon.attack(target);
    if (!attack) {
        res.status(400).send(`${pokemon.name} n'a plus d'attaque disponible`);
        return;
    }
    await savePokemon(pokemon);
    await savePokemon(target);
    res.json({
        message: `${pokemon.name} utilise ${attack.getInfo()} sur ${target.name}`,
        target: target
    });
});

app.get('/trainers', async (req, res) => {
    res.json(await getTrainers());
});

app.get('/trainers/:trainerId', async (req, res) => {
    const trainer = await getTrainer(Number(req.params.trainerId));
    if (!trainer) {
        res.status(404).send('Trainer not found');
        return;
    }
    res.json(trainer);
});

app.post('/trainers', async (req, res) => {
    const trainer = new Trainer(req.body.name);
    await insertTrainer(trainer);
    res.status(201).json(trainer);
});

app.post('/trainers/:trainerId/pokemons', async (req, res) => {
    const trainer = await getTrainer(Number(req.params.trainerId));
    if (!trainer) {
        res.status(404).send('Trainer not found');
        return;
    }
    const pokemon = new Pokemon(req.body.name, req.body.lifePoint);
    await insertPokemon(pokemon, trainer.id!);
    trainer.addPokemon(pokemon);
    res.status(201).json(trainer);
});

app.post('/trainers/:trainerId/tavern', async (req, res) => {
    const trainer = await getTrainer(Number(req.params.trainerId));
    if (!trainer) {
        res.status(404).send('Trainer not found');
        return;
    }
    trainer.healAtTavern();
    await saveTrainer(trainer);
    res.json(trainer);
});

async function battle(req: Request, res: Response, fight: (trainer1: Trainer, trainer2: Trainer) => Trainer | null) {
    const trainer1 = await getTrainer(req.body.trainer1Id);
    const trainer2 = await getTrainer(req.body.trainer2Id);
    if (!trainer1 || !trainer2) {
        res.status(404).send('Trainer not found');
        return;
    }
    if (trainer1.pokemons.length === 0 || trainer2.pokemons.length === 0) {
        res.status(400).send('Chaque dresseur doit avoir au moins un pokemon');
        return;
    }
    const winner = fight(trainer1, trainer2);
    await saveTrainer(trainer1);
    await saveTrainer(trainer2);
    res.json({
        winner: winner ? winner.name : null,
        trainers: [trainer1, trainer2]
    });
}

app.post('/battles/random-challenge', (req, res) => battle(req, res, Battle.randomChallenge));
app.post('/battles/arena1', (req, res) => battle(req, res, Battle.arena1));
app.post('/battles/deterministic-challenge', (req, res) => battle(req, res, Battle.deterministicChallenge));
app.post('/battles/arena2', (req, res) => battle(req, res, Battle.arena2));

app.listen(port, () => {
    console.log(`Pokemon API listening on port ${port}`);
});
