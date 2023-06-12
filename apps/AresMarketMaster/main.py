from fastapi import FastAPI

app = FastAPI()

@app.get("/add/{a}/{b}")
async def add(a: int, b: int):
    return {"sum": a + b}
