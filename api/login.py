from google.appengine.api import urlfetch
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from xml.dom.minidom import parseString

import re, base64, cgitb, urllib, cgi, logging
import simplejson as json

class MainHandler(webapp.RequestHandler):
	
	def get(self):
		self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( json.dumps({"status_code":-1,"message":"post only dude!"}) )

	def post(self):

		self.response.headers['Content-Type'] = 'application/json'
		cgitb.enable()
		params = cgi.FieldStorage()

		encoded_credencial = params.getvalue("credencials")
		if (encoded_credencial == None):
			self.response.out.write( json.dumps({"status_code":-2,"message":"empty user"}) )
			return

		start = params.getvalue("start")
		if (start == None):
			self.response.out.write( json.dumps({"status_code":-4,"message":"null start"}) )
			return

		try:
			result = urlfetch.fetch(url=("https://api.del.icio.us/v1/posts/all?start="+start),headers={"Authorization": "Basic %s" % encoded_credencial},deadline=60, allow_truncated=True)
			response = {"status_code":0,"result":result.content}
		except Exception, e:
			response = {"status_code":-6, "message":"%s" % e, "url":url}

		self.response.out.write( json.dumps(response) )

def main(has_debug=False):
    application = webapp.WSGIApplication([('/login', MainHandler)],debug=has_debug)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main(True)