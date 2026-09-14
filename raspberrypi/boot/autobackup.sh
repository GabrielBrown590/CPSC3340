#!/bin/bash
cp //boot/firmware/config.txt //home/stu3340/CPSC3340/raspberrypi/boot/config.txt
cp //boot/autobackup.sh //home/stu3340/CPSC3340/raspberrypi/boot/autobackup.sh
cp //etc/systemd/system/autobackup.service //home/stu3340/CPSC3340/raspberrypi/etc/systemd/system/autobackup.service
hostname -I > //home/stu3340/CPSC3340/raspberrypi/.config/ip.md

git -C //home/stu3340/CPSC3340 commit -am "auto updated files and IP address"
git -C //home/stu3340/CPSC3340 push origin main
