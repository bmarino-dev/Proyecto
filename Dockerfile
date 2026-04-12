# 1. Traemos una computadora virtual que ya trae Python 3.12 instalado
FROM python:3.12-slim

# 2. Le decimos a la computadora que no genere archivos basura de caché (.pyc)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. Creamos una carpeta adentro de esa computadora virtual llamada /app
WORKDIR /app

# 4. Copiamos tu archivo de requirements desde tu Windows al Linux virtual
COPY requirements.txt /app/

# 5. Le pedimos al Linux que instale todo
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copiamos TOOOOODO tu código de tu carpeta de Windows a la carpeta /app del Linux
COPY . /app/

# 7. Exponemos el puerto 8001 para que podamos conectarnos desde afuera
EXPOSE 8001

# 8. Finalmente, la orden que la computadora debe gritar al encenderse
CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]
