import socket

IP = "10.67.65.131"
PORT = 3333
import turtle
import time

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((IP, PORT))

t = turtle.Turtle()
t.shape("turtle")
idx = 0
while True:
	data, addr = sock.recvfrom(65535);
	message = int.from_bytes(data, byteorder='little', signed=True)
	print(message)
	
	if (idx % 100 == 0):
		t.turtlesize(stretch_wid = message/500, stretch_len = message/500, outline=5)
	idx += 1
