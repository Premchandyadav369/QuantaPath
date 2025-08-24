import { ClassicalService } from '../classical-service';
import type { DistanceMatrix } from '../../types';

class TestableClassicalService extends ClassicalService {
    public testChristofides(distanceMatrix: number[][]) {
        // @ts-ignore - accessing private method for test
        return this.christofides(distanceMatrix);
    }
}

describe('ClassicalService - Christofides', () => {
    let service: TestableClassicalService;
    let distanceMatrix: number[][];

    beforeEach(() => {
        service = new TestableClassicalService();
        distanceMatrix = [
            [0, 10, 20, 30],
            [10, 0, 15, 35],
            [20, 15, 0, 25],
            [30, 35, 25, 0]
        ];
    });

    it('should return a valid tour for the Christofides algorithm', async () => {
        const result = await service.testChristofides(distanceMatrix);

        expect(result.solver).toBe('classical');
        expect(result.name).toBe('Christofides (approx)');
        expect(result.feasible).toBe(true);

        // Check if it's a valid Hamiltonian cycle
        const tour = result.tour;
        expect(tour[0]).toBe(0); // Starts at depot
        expect(tour[tour.length - 1]).toBe(0); // Ends at depot

        const visited = new Set(tour.slice(0, -1));
        expect(visited.size).toBe(distanceMatrix.length); // Visits every city exactly once

        // Check if all cities are visited
        for(let i = 0; i < distanceMatrix.length; i++) {
            expect(visited.has(i)).toBe(true);
        }
    });
});
