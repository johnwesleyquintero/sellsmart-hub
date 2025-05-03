export async function getRedisValue(key: string): Promise<any> {
  try {
    const response = await fetch(`/api/redis?key=${key}`);
    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function setRedisValue(key: string, value: string): Promise<void> {
  try {
    await fetch('/api/redis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value }),
    });
  } catch (error) {
    console.error(error);
  }
}

export const Cache = {
  getItem: getRedisValue,
  setItem: setRedisValue,
};
