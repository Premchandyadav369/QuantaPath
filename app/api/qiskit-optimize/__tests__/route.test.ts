import { POST } from '../route';
import { type NextRequest } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs/promises';

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
      headers: new Headers(init?.headers),
    })),
  },
}));

// Mock child_process and fs
jest.mock('child_process');
jest.mock('fs/promises');

const mockedExec = exec as jest.Mock;
const mockedWriteFile = fs.writeFile as jest.Mock;
const mockedUnlink = fs.unlink as jest.Mock;

describe('/api/qiskit-optimize', () => {
  beforeEach(() => {
    mockedExec.mockClear();
    mockedWriteFile.mockClear();
    mockedUnlink.mockClear();
  });

  it('should return a valid optimization result when successful', async () => {
    // Mock the Python script's output
    const mockPythonOutput = {
      tour: [0, 1, 2, 0],
      length: 45,
      feasible: true,
      violations: { pos: 0, city: 0 },
      details: {},
    };
    mockedExec.mockImplementation((command, callback) => {
      callback(null, JSON.stringify(mockPythonOutput), '');
    });

    const mockRequest = {
      json: async () => ({
        stops: [
          { id: '0', name: 'Depot', lat: 0, lng: 0, isDepot: true },
          { id: '1', name: 'Stop 1', lat: 1, lng: 1 },
          { id: '2', name: 'Stop 2', lat: 2, lng: 2 },
        ],
        quantum: { p: 2 },
        optimizeFor: "distance",
        distanceSource: "openrouteservice",
      }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.name).toContain('Qiskit QAOA');
    expect(body.tour).toEqual([0, 1, 2, 0]);
    expect(body.length).toBe(45);
    expect(mockedWriteFile).toHaveBeenCalled();
    expect(mockedExec).toHaveBeenCalled();
    expect(mockedUnlink).toHaveBeenCalled();
  });

  it('should return a 500 error if the script fails', async () => {
    // Mock a failure from the Python script
    const errorMessage = 'Python script failed';
    mockedExec.mockImplementation((command, callback) => {
      callback(new Error(errorMessage), '', 'Some stderr error');
    });

     const mockRequest = {
      json: async () => ({
        stops: [
          { id: '0', name: 'Depot', lat: 0, lng: 0, isDepot: true },
          { id: '1', name: 'Stop 1', lat: 1, lng: 1 },
          { id: '2', name: 'Stop 2', lat: 2, lng: 2 },
        ],
        quantum: { p: 2 },
        optimizeFor: "distance",
        distanceSource: "openrouteservice",
      }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('Failed to execute Qiskit solver');
  });

   it('should return a 400 error for too many stops', async () => {
    const mockRequest = {
      json: async () => ({
        stops: Array.from({ length: 8 }, (_, i) => ({ id: `${i}`, name: `Stop ${i}`, lat: i, lng: i })),
        quantum: { p: 2 },
        optimizeFor: "distance",
        distanceSource: "openrouteservice",
      }),
    } as NextRequest;

    const response = await POST(mockRequest);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('maximum of 7 stops');
  });
});
