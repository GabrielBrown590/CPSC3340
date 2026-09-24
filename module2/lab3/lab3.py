from gpiozero import Button
button = Button(17)
switch = Button(27)
joyx = Button(22)
while True:
	if button.is_pressed:
		if not switch.is_pressed:
			print("you are in state one!")
		else:
			print("you are in state three!")
	elif switch.is_pressed:
		print("you are in state two!")
	elif joyx.is_pressed:
		print("you are in state four!")
	else:
		print("you are in state five!")
